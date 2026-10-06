fetch("https://mess-tracker-amber.vercel.app/")
  .then(async res => {
    const text = await res.text();
    console.log("HTML length:", text.length);
    console.log(text.includes("vite"));
  })
  .catch(console.error);
