let tl = gsap.timeline();
let tl1 = gsap.timeline();

gsap.from("nav", {
  opacity: 0,
  duration: 0.3,
  y: -30,
});

gsap.from(".nav-links>li", {
  opacity: 0,
  duration: 0.4,
  stagger: 0.1,
  y: -30,
});

gsap.from(".left-hero", {
  opacity: 0,
  duration: 0.5,
  y: 200,
});
gsap.from(".right-hero", {
  opacity: 0,
  duration: 0.5,
  x: 200,
});

let darkBtn = document.querySelectorAll(".dark-btn");

