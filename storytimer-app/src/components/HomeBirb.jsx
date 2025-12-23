import '../stylesheets/HomeBirb.css';

import birb_idle_looped from "../videos/birb/idle/birb_idle_looped.mp4";

export default function HomeBirb() {

  return (
    <div id="birbContainer">
      <video
        src={birb_idle_looped}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        id="birb"
      />
    </div>
  );
}