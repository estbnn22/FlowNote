import { SignUp } from "@stackframe/stack";

export default function SignIn() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl font-semibold mt-20 text-center">
        Sign In to get started with{" "}
        <span className="text-primary">FlowNote</span>
      </h1>

      <SignUp fullPage />
    </div>
  );
}
