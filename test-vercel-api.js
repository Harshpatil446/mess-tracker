fetch("https://mess-tracker-amber.vercel.app/api")
  .then(async res => {
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text.substring(0, 200));
  })
  .catch(console.error);
