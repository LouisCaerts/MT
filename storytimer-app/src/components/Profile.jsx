import testImageURL from "../images/test.png"

export default function Profile() {
  return (
    <img
      src={testImageURL}
      alt="a cartoon wolf"
      style={{
        position: "absolute",
        bottom: "2rem",
        left: "2rem",

        // Responsive but bounded size:
        // - never smaller than 120 px
        // - ideally 20 % of window width
        // - never larger than 240 px
        width: "clamp(120px, 20vw, 240px)",
        height: "auto",

        // Optional polish
        userSelect: "none",
        pointerEvents: "none", // so it doesn't block clicks
      }}
    />
  )
}