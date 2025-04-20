import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

export const useSignout = () => {
  const navigate = useNavigate();

  return useCallback(() => {
    navigate({ to: "/" });
  }, [navigate]);
};
