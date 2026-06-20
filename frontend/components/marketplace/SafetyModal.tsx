'use client'

export function SafetyModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="text-center">
          <span className="text-4xl">🛡️</span>
          <h2 className="text-lg font-bold text-gray-900 mt-2">Safe Exchange Tips</h2>
          <p className="text-sm text-gray-500 mt-1">Read before messaging</p>
        </div>

        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-2.5">
            <span className="shrink-0">📍</span>
            <span>Meet at a public location — marina, boat launch, or community dock</span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0">👥</span>
            <span>Bring a friend or family member for high-value items</span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0">🚫</span>
            <span>Never share bank account, Zelle, or wire info through messages</span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0">🔍</span>
            <span>Inspect the item in person before handing over payment</span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0">🔒</span>
            <span>Keep all communication on the platform until you feel comfortable</span>
          </li>
        </ul>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-water-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-water-700 transition-colors"
          >
            Got it, message seller
          </button>
        </div>
      </div>
    </div>
  )
}
