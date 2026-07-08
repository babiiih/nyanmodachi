import { createFileRoute } from "@tanstack/react-router";
import { CatRoom } from "@/components/CatRoom";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nyanmodachi — Virtual Cat Room" },
      {
        name: "description",
        content:
          "Ruangan virtual berisi lima kucing chibi yang berkeliaran bebas — permainan tomodachi santai ala Pou.",
      },
      { property: "og:title", content: "Nyanmodachi — Virtual Cat Room" },
      {
        property: "og:description",
        content: "Lima kucing chibi berkeliaran bebas di kamar virtualmu.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <CatRoom />;
}
