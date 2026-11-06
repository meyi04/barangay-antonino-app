import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

export const deleteResidentAccount = onCall(
    { region: "asia-southeast1" },
    async (request) => {
        const callerUid = request.auth?.uid;
        if (!callerUid) {
            throw new HttpsError("unauthenticated", "Sign in as an administrator to remove an account.");
        }

        const targetUid = request.data?.uid;
        if (typeof targetUid !== "string" || targetUid.length === 0) {
            throw new HttpsError("invalid-argument", "A valid user ID is required.");
        }
        if (targetUid === callerUid) {
            throw new HttpsError("failed-precondition", "You cannot remove your own administrator account.");
        }

        const firestore = getFirestore();
        const callerSnapshot = await firestore.collection("users").doc(callerUid).get();
        if (callerSnapshot.get("role") !== "admin") {
            throw new HttpsError("permission-denied", "Only administrators can remove resident accounts.");
        }

        const targetRef = firestore.collection("users").doc(targetUid);
        const targetSnapshot = await targetRef.get();
        if (!targetSnapshot.exists) {
            throw new HttpsError("not-found", "The user profile no longer exists.");
        }
        if (targetSnapshot.get("role") !== "resident") {
            throw new HttpsError("failed-precondition", "Only resident accounts can be removed here.");
        }

        try {
            try {
                await getAuth().deleteUser(targetUid);
            } catch (error) {
                if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
            }
            await Promise.all([
                firestore.recursiveDelete(targetRef),
                firestore.recursiveDelete(firestore.collection("chats").doc(targetUid)),
            ]);
        } catch (error) {
            console.error("Unable to fully remove resident account", { targetUid, error });
            throw new HttpsError("internal", "Unable to fully remove this account. Please try again.");
        }

        return { success: true };
    }
);

export const notifyResidentOnRequestStatusChange = onDocumentUpdated(
    { document: "requests/{requestId}", region: "asia-southeast1" },
    async (event) => {
        const change = event.data;
        if (!change) return;

        const previousStatus = change.before.get("status");
        const newStatus = change.after.get("status");
        if (
            typeof newStatus !== "string" ||
            newStatus === previousStatus ||
            !["Pending", "In Progress", "Resolved"].includes(newStatus)
        ) {
            return;
        }

        const residentUid = change.after.get("submittedByUid");
        if (typeof residentUid !== "string" || residentUid.length === 0) return;

        const tokenSnapshot = await getFirestore()
            .collection("users")
            .doc(residentUid)
            .collection("fcmTokens")
            .get();

        const tokenDocuments = tokenSnapshot.docs.flatMap((snapshot) => {
            const token = snapshot.get("token");
            return typeof token === "string" ? [{ ref: snapshot.ref, token }] : [];
        });
        if (tokenDocuments.length === 0) return;

        const ticketNo = change.after.get("ticketNo");
        const displayTicket = typeof ticketNo === "string" ? ticketNo : event.params.requestId;
        const message = {
            notification: {
                title: "Request status updated",
                body: `Your request ${displayTicket} is now ${newStatus}.`,
            },
            data: {
                requestId: event.params.requestId,
                ticketNo: displayTicket,
                status: newStatus,
            },
            android: { priority: "high" as const },
            webpush: {
                notification: { icon: "/app-icon.svg" },
            },
        };

        for (let index = 0; index < tokenDocuments.length; index += 500) {
            const batch = tokenDocuments.slice(index, index + 500);
            const result = await getMessaging().sendEachForMulticast({
                ...message,
                tokens: batch.map(({ token }) => token),
            });

            const staleTokenDocuments = result.responses.flatMap((response, responseIndex) => {
                const code = response.error?.code;
                return !response.success &&
                    (code === "messaging/registration-token-not-registered" ||
                        code === "messaging/invalid-registration-token")
                    ? [batch[responseIndex].ref]
                    : [];
            });

            await Promise.all(staleTokenDocuments.map((reference) => reference.delete()));
        }
    }
);