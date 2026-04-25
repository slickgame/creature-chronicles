import { redirect } from "next/navigation";

export default function BreedingPage() {
  redirect("/ranch?tab=breeding");
}
