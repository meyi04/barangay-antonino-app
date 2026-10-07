import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export async function registerResidentPushNotifications(
    uid: string,
    requestWebPermission = false
): Promise<() => Promise<void>> {
    const platform = Capacitor.getPlatform();
    const isAndroid = Capacitor.isNativePlatform() && platform === "android";
    const isWeb = !Capacitor.isNativePlatform() && platform === "web";
    if (!isAndroid && !isWeb) {
        return async () => { };
    }

    let vapidKey: string | undefined;
    let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;

    if (isWeb) {
        vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            throw new Error("Web push is not configured. Add VITE_FIREBASE_VAPID_KEY to the deployment environment.");
        }
        if (!window.isSecureContext || !("serviceWorker" in navigator)) {
            throw new Error("Web push requires an HTTPS site and service worker support.");
        }
        if (!(await FirebaseMessaging.isSupported()).isSupported) {
            throw new Error("This browser does not support Firebase web push notifications.");
        }

        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        serviceWorkerRegistration = await navigator.serviceWorker.ready;
    }

    let active = true;
    let tokenDocument: ReturnType<typeof doc> | null = null;
    let pendingWrites = Promise.resolve();
    let tokenListener: PluginListenerHandle | undefined;

    const saveToken = (token: string) => {
        const write = pendingWrites.then(async () => {
            if (!active) return;

            const nextTokenDocument = doc(
                db,
                "users",
                uid,
                "fcmTokens",
                encodeURIComponent(token)
            );

            if (tokenDocument && tokenDocument.path !== nextTokenDocument.path) {
                await deleteDoc(tokenDocument);
            }

            await setDoc(nextTokenDocument, {
                token,
                platform: isAndroid ? "android" : "web",
                updatedAt: serverTimestamp(),
            });
            tokenDocument = nextTokenDocument;
        });
        pendingWrites = write.catch((error) => {
            console.error("Unable to save the FCM registration token", error);
        });

        return write;
    };

    const stop = async () => {
        if (!active) return;
        active = false;
        await tokenListener?.remove();
        await pendingWrites;

        if (tokenDocument) {
            try {
                await deleteDoc(tokenDocument);
            } catch (error) {
                console.error("Unable to remove the FCM registration token", error);
            }
            tokenDocument = null;
        }
    };

    try {
        if (isAndroid) {
            tokenListener = await FirebaseMessaging.addListener("tokenReceived", ({ token }) => {
                void saveToken(token).catch((error) => {
                    console.error("Unable to update the FCM registration token", error);
                });
            });
        }

        const currentPermission = await FirebaseMessaging.checkPermissions();
        let permission = currentPermission;
        if (permission.receive !== "granted") {
            if (isWeb && !requestWebPermission) {
                return stop;
            }
            permission = await FirebaseMessaging.requestPermissions();
        }

        if (permission.receive !== "granted") {
            throw new Error("Notification permission was not granted.");
        }

        const { token } = await FirebaseMessaging.getToken(isWeb
            ? { vapidKey, serviceWorkerRegistration }
            : undefined);
        await saveToken(token);
        return stop;
    } catch (error) {
        await stop();
        throw error;
    }
}