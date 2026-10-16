import Stat from "../ui/Stat";
import { formatMinutes, minutesUntilTurn, peopleAhead } from "../../lib/queue";

/** Wait estimate for someone joining right now. */
export default function QueueInfo({ customers }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Estimated wait" value={`~${formatMinutes(minutesUntilTurn(customers))}`} tone="brand" />
      <Stat label="People ahead" value={peopleAhead(customers)} />
    </div>
  );
}
