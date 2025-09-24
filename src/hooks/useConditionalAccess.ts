import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { getGraphServiceClient } from "../lib/graphClient";
import { ConditionalAccessPolicy } from "../types/conditionalAccess";
import { loginRequest } from "../lib/msalConfig";

export const useConditionalAccess = () => {
  const { instance, accounts } = useMsal();
  const [policies, setPolicies] = useState<ConditionalAccessPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = async () => {
    if (accounts.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      
      const graphClient = getGraphServiceClient(response.accessToken);
      const policiesResponse = await graphClient.api('/identity/conditionalAccess/policies').get();
      
      setPolicies(policiesResponse.value || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch policies");
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policy: ConditionalAccessPolicy) => {
    if (accounts.length === 0) return null;
    
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      
      const graphClient = getGraphServiceClient(response.accessToken);
      const newPolicy = await graphClient.api('/identity/conditionalAccess/policies').post(policy);
      
      await fetchPolicies();
      return newPolicy;
    } catch (err: any) {
      setError(err.message || "Failed to create policy");
      return null;
    }
  };

  const updatePolicy = async (id: string, policy: ConditionalAccessPolicy) => {
    if (accounts.length === 0) return null;
    
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      
      const graphClient = getGraphServiceClient(response.accessToken);
      const updatedPolicy = await graphClient.api(`/identity/conditionalAccess/policies/${id}`).patch(policy);
      
      await fetchPolicies();
      return updatedPolicy;
    } catch (err: any) {
      setError(err.message || "Failed to update policy");
      return null;
    }
  };

  const deletePolicy = async (id: string) => {
    if (accounts.length === 0) return false;
    
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      
      const graphClient = getGraphServiceClient(response.accessToken);
      await graphClient.api(`/identity/conditionalAccess/policies/${id}`).delete();
      
      await fetchPolicies();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete policy");
      return false;
    }
  };

  useEffect(() => {
    if (accounts.length > 0) {
      fetchPolicies();
    }
  }, [accounts]);

  return {
    policies,
    loading,
    error,
    fetchPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
  };
};