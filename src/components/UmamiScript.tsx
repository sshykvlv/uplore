/**
 * Injects the Umami analytics script when both env vars are set.
 * Renders nothing if either var is missing — analytics are fully optional.
 * This is a server component; it reads env vars at build/request time.
 */
export default function UmamiScript() {
  const url = process.env.NEXT_PUBLIC_UMAMI_URL
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

  if (!url || !id) return null

  // Ensure the script src ends with /script.js
  const scriptSrc = url.replace(/\/+$/, '') + '/script.js'

  return (
    <script
      defer
      src={scriptSrc}
      data-website-id={id}
      // data-domains can be set via PUBLIC_URL if needed; omit for simplicity
    />
  )
}
