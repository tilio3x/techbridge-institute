export function normalizeCourse(c) {
  return {
    id: c.id,
    vendor: c.vendor_id,
    code: c.code,
    title: c.title,
    level: c.level,
    duration: c.duration,
    price: Number(c.price),
    seats: c.seats,
    enrolled: c.enrolled,
    delivery: c.delivery,
    nextStart: c.next_start,
    description: c.description,
    badge: c.badge || "",
    tags: c.tags || [],
    vendorName: c.vendor_name,
    vendorColor: c.vendor_color,
    vendorLogo: c.vendor_logo,
    instructorId: c.instructor_id || null,
    instructorName: c.instructor_first_name
      ? `${c.instructor_first_name} ${c.instructor_last_name}`
      : null,
    locationId: c.loc_id || null,
    locationName: c.loc_name || null,
    locationType: c.loc_type || null,
    locationCity: c.loc_city || null,
    locationCountry: c.loc_country || null,
    locationRoom: c.loc_room || null,
    locationBuilding: c.loc_building || null,
    locationFloor: c.loc_floor || null,
    locationCapacity: c.loc_capacity || null,
    locationPlatform: c.loc_platform || null,
    locationTimezone: c.loc_timezone || null,
  };
}

export function normalizeSchedule(s) {
  return {
    id: s.id,
    courseId: s.course_id,
    day: s.day,
    time: s.time,
    instructor: s.instructor,
    room: s.room,
    type: s.type,
  };
}
