import { Phone, UserRound } from "lucide-react";
import Field from "../ui/Field";
import { BUSINESS } from "../../config/business";

export default function CustomerForm({ values, errors, onChange }) {
  const update = (field) => (e) => onChange({ ...values, [field]: e.target.value });

  return (
    <div className="grid gap-4">
      <Field
        id="name"
        name="name"
        label="Your name"
        icon={UserRound}
        autoComplete="name"
        placeholder="The name the barber will call"
        value={values.name}
        onChange={update("name")}
        error={errors.name}
        maxLength={50}
        required
      />
      <Field
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        label="Phone number"
        optional
        icon={Phone}
        autoComplete="tel"
        placeholder={BUSINESS.phonePlaceholder}
        value={values.phone}
        onChange={update("phone")}
        error={errors.phone}
        hint="So the shop can reach you when your turn is near."
      />
    </div>
  );
}
