importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyDHum_cyoSrtnanWJR7Rmxt3KzVIChCrgw",
    authDomain: "antonino-cf44b.firebaseapp.com",
    projectId: "antonino-cf44b",
    storageBucket: "antonino-cf44b.firebasestorage.app",
    messagingSenderId: "701874234514",
    appId: "1:701874234514:web:39710a2e42c6b113c0b24b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Barangay Antonino";
    const options = {
        body: payload.notification?.body || "Your request status has changed.",
        icon: "/app-icon.svg",
        badge: "/app-icon.svg",
        data: payload.data || {},
    };

    return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const target = new URL("/", self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
            const existingClient = clients.find((client) => client.url.startsWith(self.location.origin));
            return existingClient ? existingClient.focus() : self.clients.openWindow(target);
        })
    );
});