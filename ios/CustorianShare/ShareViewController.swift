import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // Extract shared text
        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
            close()
            return
        }

        for item in items {
            guard let attachments = item.attachments else { continue }
            for attachment in attachments {
                if attachment.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    attachment.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] data, _ in
                        if let text = data as? String {
                            DispatchQueue.main.async {
                                self?.openApp(with: text)
                            }
                        }
                    }
                    return
                }
                if attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    attachment.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] data, _ in
                        if let url = data as? URL {
                            DispatchQueue.main.async {
                                self?.openApp(with: url.absoluteString)
                            }
                        }
                    }
                    return
                }
            }
        }
        close()
    }

    func openApp(with text: String) {
        // Save shared text to App Group for the main app to read
        let defaults = UserDefaults(suiteName: "group.com.custorian.app")
        defaults?.set(text, forKey: "custorian_shared_text")
        defaults?.synchronize()

        // Open the main app via URL scheme
        let url = URL(string: "custorian://safety-coach?sharedText=\(text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")!
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url)
                break
            }
            responder = responder?.next
        }

        close()
    }

    func close() {
        extensionContext?.completeRequest(returningItems: nil)
    }
}
