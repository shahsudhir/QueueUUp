import { useCallback, useEffect, useState } from "react";
import { KeyRound, Lock, Mail, Trash2, UserPlus, Users } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import PageLoader from "../components/ui/PageLoader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { createUser, deleteUser, listUsers, resetUserPassword } from "../services/userService";
import { validateNewPassword, validateNewUser } from "../lib/validation";
import { cn } from "../lib/cn";

const EMPTY_FORM = { email: "", password: "", role: "STAFF" };

function roleLabel(role) {
  return role ? role.replace("ROLE_", "").toLowerCase() : "";
}

export default function StaffManagement() {
  const { session } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const [resetId, setResetId] = useState(null);
  const [resetValue, setResetValue] = useState("");
  const [resetError, setResetError] = useState(null);
  const [resetting, setResetting] = useState(false);

  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoadError(null);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleCreate(event) {
    event.preventDefault();
    const errors = validateNewUser(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setCreating(true);
    try {
      const created = await createUser(form);
      toast.success(`${created.email} can now sign in.`);
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (err) {
      setFormErrors({ form: err.message });
    } finally {
      setCreating(false);
    }
  }

  function openReset(user) {
    setResetId(user.id);
    setResetValue("");
    setResetError(null);
  }

  async function handleReset(user) {
    const error = validateNewPassword(resetValue);
    setResetError(error);
    if (error) return;

    setResetting(true);
    try {
      const result = await resetUserPassword(user.id, resetValue);
      toast.success(result?.message || "Password reset.");
      setResetId(null);
      setResetValue("");
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetting(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const result = await deleteUser(toRemove.id);
      toast.success(result?.message || "Account removed.");
      setToRemove(null);
      await loadUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRemoving(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle={`Accounts for ${session?.shopName ?? "your shop"}`}
        backTo="/business-dashboard"
      />

      <Card className="mt-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <UserPlus className="size-5 text-brand-600" />
          Add an account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Share the email and password with the person. They can change the password after signing in.
        </p>

        <form onSubmit={handleCreate} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
          {formErrors.form && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">
              {formErrors.form}
            </p>
          )}

          <Field id="new-email" type="email" label="Email" icon={Mail} autoComplete="off"
            value={form.email} onChange={update("email")} error={formErrors.email} />
          <Field id="new-password" type="text" label="Temporary password" icon={Lock} autoComplete="new-password"
            value={form.password} onChange={update("password")} error={formErrors.password} hint="At least 6 characters." />

          <div className="grid gap-1.5">
            <label htmlFor="new-role" className="text-sm font-semibold text-ink">Role</label>
            <select
              id="new-role"
              value={form.role}
              onChange={update("role")}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            >
              <option value="STAFF">Staff: serve and skip customers</option>
              <option value="ADMIN">Admin: also manages accounts</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button type="submit" fullWidth loading={creating}>
              {creating ? "Adding" : "Add account"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Users className="size-5 text-brand-600" />
          Accounts ({users.length})
        </h2>

        {loadError ? (
          <p role="alert" className="py-6 text-center text-sm text-red-600">{loadError}</p>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No accounts yet" />
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {users.map((user) => {
              const isMe = user.email === session?.email;
              const isAdmin = user.role === "ROLE_ADMIN";
              return (
                <li key={user.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">
                        {user.email}
                        {isMe && <span className="ml-2 text-sm font-medium text-slate-400">(you)</span>}
                      </p>
                      <span
                        className={cn(
                          "mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
                          isAdmin ? "bg-brand-50 text-brand-700 ring-brand-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"
                        )}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </div>

                    {!isMe && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openReset(user)}>
                          <KeyRound />
                          Reset password
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setToRemove(user)} aria-label={`Remove ${user.email}`}>
                          <Trash2 />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  {resetId === user.id && (
                    <div className="mt-3 grid gap-3 rounded-2xl bg-paper p-4 sm:grid-cols-[1fr_auto_auto] sm:items-start">
                      <Field id={`reset-${user.id}`} type="text" label={`New password for ${user.email}`} icon={Lock}
                        autoComplete="new-password" value={resetValue} onChange={(e) => setResetValue(e.target.value)} error={resetError} />
                      <Button className="sm:mt-7" onClick={() => handleReset(user)} loading={resetting}>Save</Button>
                      <Button className="sm:mt-7" variant="secondary" onClick={() => setResetId(null)} disabled={resetting}>Cancel</Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(toRemove)}
        title={toRemove ? `Remove ${toRemove.email}?` : ""}
        description="They won't be able to sign in anymore. This can't be undone."
        confirmLabel="Remove"
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => setToRemove(null)}
      />
    </>
  );
}
