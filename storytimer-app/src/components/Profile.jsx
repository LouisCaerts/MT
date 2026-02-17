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

        width: "clamp(120px, 20vw, 240px)",
        height: "auto",
        userSelect: "none",
        pointerEvents: "none",
      }}
    />
  )
}