fetch("https://mess-tracker-amber.vercel.app/api/hello")
  .then(async res => {
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  })
  .catch(console.error);
