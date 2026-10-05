import Foundation
import Vision

for path in CommandLine.arguments.dropFirst() {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    try VNImageRequestHandler(url: URL(fileURLWithPath: path)).perform([request])
    let observations = (request.results ?? []).compactMap { observation -> [String: Any]? in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        let box = observation.boundingBox
        return [
            "text": candidate.string,
            "x": box.minX,
            "y": 1 - box.maxY,
            "width": box.width,
            "height": box.height
        ]
    }
    let data = try JSONSerialization.data(withJSONObject: ["file": path, "lines": observations], options: [.sortedKeys])
    print(String(decoding: data, as: UTF8.self))
}