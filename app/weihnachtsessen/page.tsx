import { permanentRedirect } from "next/navigation";

/**
 * Die Umfrage lag früher unter /weihnachtsessen. Der Link wurde schon
 * geteilt, deshalb bleibt er gültig und zeigt auf die neue Adresse.
 */
export default function AlteWeihnachtsessenAdresse() {
  permanentRedirect("/umfrage/weihnachtsessen");
}
