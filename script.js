let score = 0;
const button = document.getElementById("catch-me");
const scoreDisplay = document.getElementById("score");

button.addEventListener("click", () => {
  score++;
  scoreDisplay.textContent = score;

  // Move the button to a random place
  const x = Math.random() * (window.innerWidth - 100);
  const y = Math.random() * (window.innerHeight - 100);
  button.style.left = `${x}px`;
  button.style.top = `${y}px`;

  // Change button color randomly
  button.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
});
