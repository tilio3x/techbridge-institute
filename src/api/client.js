const BASE = "/api";

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

export const api = {
  vendors: {
    list: () => request("/vendors"),
  },
  courses: {
    list: () => request("/courses"),
    create: (data) => request("/courses", { method: "POST", body: data }),
    update: (id, data) => request(`/courses/${id}`, { method: "PUT", body: data }),
    remove: (id) => request(`/courses/${id}`, { method: "DELETE" }),
  },
  instructors: {
    list: () => request("/instructors"),
    create: (data) => request("/instructors", { method: "POST", body: data }),
    update: (id, data) => request(`/instructors/${id}`, { method: "PUT", body: data }),
    remove: (id) => request(`/instructors/${id}`, { method: "DELETE" }),
  },
  locations: {
    list: () => request("/delivery-locations"),
    physical: () => request("/locations/physical"),
    create: (data) => request("/delivery-locations", { method: "POST", body: data }),
    update: (id, data) => request(`/delivery-locations/${id}`, { method: "PUT", body: data }),
    remove: (id) => request(`/delivery-locations/${id}`, { method: "DELETE" }),
  },
  schedule: {
    list: () => request("/schedule"),
    create: (data) => request("/schedule", { method: "POST", body: data }),
    update: (id, data) => request(`/schedule/${id}`, { method: "PUT", body: data }),
    remove: (id) => request(`/schedule/${id}`, { method: "DELETE" }),
  },
  students: {
    list: () => request("/students"),
    enrollments: (id) => request(`/students/${id}/enrollments`),
  },
  enrollments: {
    list: () => request("/enrollments"),
    enroll: (data) => request("/enrollments", { method: "POST", body: data }),
    unenroll: (data) => request("/enrollments", { method: "DELETE", body: data }),
  },
  profiles: {
    list: () => request("/profiles"),
    get: (oid) => request(`/profile/${oid}`),
    save: (data) => request("/profile", { method: "POST", body: data }),
    remove: (oid) => request(`/profile/${oid}`, { method: "DELETE" }),
  },
  contact: {
    submit: (data) => request("/contact", { method: "POST", body: data }),
  },
};
