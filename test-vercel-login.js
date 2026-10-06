fetch("https://mess-tracker-amber.vercel.app/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mobile: "9405186404" })
})
  .then(async res => {
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  })
  .catch(console.error);
