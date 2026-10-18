import { submittedValues } from "@/lib/auth/schemas";

test("keeps what the student typed so a failed submit doesn't wipe the form", () => {
  const fd = new FormData();
  fd.set("username", "sam_99");
  fd.set("city", "Toronto");
  fd.set("password", "secret-pass");
  expect(submittedValues(fd, ["username", "city", "firstName"])).toEqual({ username: "sam_99", city: "Toronto", firstName: "" });
});

test("never echoes a field it wasn't asked for, like the password", () => {
  const fd = new FormData();
  fd.set("email", "a@b.co");
  fd.set("password", "secret-pass");
  expect(submittedValues(fd, ["email"])).toEqual({ email: "a@b.co" });
});
