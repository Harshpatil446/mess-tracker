const http = require("http");

http.get("http://localhost:8080/api/auth/login", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log("Status:", res.statusCode, "Body:", data));
}).on("error", (err) => {
  console.error("HTTP Error:", err.message);
});
