import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
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