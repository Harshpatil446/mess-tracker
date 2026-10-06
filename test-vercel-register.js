fetch("https://mess-tracker-amber.vercel.app/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Test", mobile: "1234567890", email: "test@test.com", password: "password", messName: "Test Mess" })
})
  .then(async res => {
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  })
  .catch(console.error);
