const API_URL = process.env.VUE_APP_API_URL;

const fetchData = async (endpoint, method = "GET", body = null) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
      console.log(new Error(`Error: ${response.status}`));
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

const patchWorkstation = async (data) => {
  const id = localStorage.getItem("designatedWorkstation");
  return await fetchData(`/api/scheduling/workstation/${id}`, "PATCH", data);
};

export { fetchData, patchWorkstation };
