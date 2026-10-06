fetch("https://mess-tracker-iq1e55i5w-harsh-4dd3.vercel.app/api/hello")
  .then(async res => {
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  })
  .catch(console.error);
