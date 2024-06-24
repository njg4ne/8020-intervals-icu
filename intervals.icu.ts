const { API_KEY, ATHLETE_ID } = process.env;
const API_SERVER = "https://intervals.icu";
const USER_NAME = "API_KEY";

const res = await fetch(`${API_SERVER}/api/v1/athlete/${ATHLETE_ID}/folders`, {
  headers: {
    Authorization: `Basic ${btoa(`${USER_NAME}:${API_KEY}`)}`,
  },
});

function getAuthHeaders() {
  return {
    Authorization: `Basic ${btoa(`${USER_NAME}:${API_KEY}`)}`,
  };
}

// await fetch(`${API_SERVER}/api/v1/athlete/${ATHLETE_ID}/workouts`, {
//   method: "POST",
//   headers: {
//     Authorization: `Basic ${btoa(`${USER_NAME}:${API_KEY}`)}`,
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify(postData),
// });
export default async function contact(data: { endpoint: string; body?: any }) {
  let { body, endpoint } = data;
  const method = body ? "POST" : "GET";
  const url = `${API_SERVER}/api/v1/athlete/${ATHLETE_ID}${endpoint}`;
  let headers: any = getAuthHeaders();
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  const bodyObj = body ? { body: JSON.stringify(body) } : {};
  //   console.log(bodyObj);
  const res = await fetch(url, { method, headers, ...bodyObj });
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
}
