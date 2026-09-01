import { api } from "@/convex/_generated/api";
import { SignedIn } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { dark } from "@clerk/themes";
import { useMutation } from "convex/react";
import React from "react";
import { toast } from "sonner";

const ClerkBillingButton = () => {
  const updatePlan = useMutation(api.users.updatePlan);

  return (
    <SignedIn>
      <CheckoutButton
        planId="cplan_33KLrsmNUDfFM0Gov0JfbVPuj87"
        planPeriod="month"
        checkoutProps={{ appearance: { baseTheme: dark } }}
        onSubscriptionComplete={async () => {
          await updatePlan({
            plan: "pro",
          });
          toast.success("Subscribed To Pro Successfully");
        }}
      >
        <button className="w-full mt-auto bg-sky-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-sky-500 disabled:bg-sky-300 transition-colors cursor-pointer">
          Choose Pro
        </button>
      </CheckoutButton>
    </SignedIn>
  );
};

export default ClerkBillingButton;
