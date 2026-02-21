export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-lg font-semibold text-white">Connecting to video call...</p>
      </div>
    </div>
  )
}
