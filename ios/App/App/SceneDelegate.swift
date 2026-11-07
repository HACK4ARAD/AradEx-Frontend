import UIKit
import Capacitor

/// iOS 27 închide aplicațiile care nu folosesc ciclul de viață cu scene (UIScene). Fereastra și `CAPBridgeViewController`
/// vin din `Main.storyboard` (UISceneStoryboardFile în Info.plist); aici doar dăm mai departe link-urile deschise în aplicație.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard scene is UIWindowScene else { return }
        if let url = connectionOptions.urlContexts.first?.url {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if let url = URLContexts.first?.url {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
    }
}
