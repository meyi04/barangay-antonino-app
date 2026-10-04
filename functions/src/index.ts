import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

initializeApp();

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