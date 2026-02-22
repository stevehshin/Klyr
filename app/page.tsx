import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");
    if (session) {
      redirect("/grid");
    }
  } catch (e) {
    console.error("Home page error:", e);
  }
  redirect("/login");
}
