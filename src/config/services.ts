import axios from "axios";
import ApiConfig from "./apiConfig";
import { toast } from "react-toastify";


const getAuthHeaders = (token:string) => ({
  headers: {
    'Authorization': `Bearer ${token}`,
    "Content-Type": "application/json",
  }
});
const getAuthHeadersFormData = (token:string) => ({
  headers: {
    'Authorization': `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  }
});

// Common response handler
const handleResponse = (res:any, successMessage?:string) => {
  if (res?.status === 200 || res?.status === 201) {
    return res.data;
  } else {
    const errorMsg = res?.data?.message || 
                    res?.data?.error ||
                    "Request failed";
    throw res?.data || res; // Throw instead of return to maintain error flow
  }
};

const handleError = (error:any) => {
  // console.error("API Error:", error);
  const errorMsg = error.response?.data?.message || 
                  error.response?.data?.error || 
                  error.message || 
                  "Request failed";
  throw error.response?.data || error.response || error; // Throw to maintain error flow
};

// Base request handler
const makeRequest = async (method:any, endPointOrUrl:any, config:any) => {
  try {
    const finalUrl = config.isUrl
      ? endPointOrUrl 
      : ApiConfig[endPointOrUrl]; 
    
    const response = await axios({
      method,
      url: finalUrl,
      ...config
    });

    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const postDataHandler = async (endPoint:any, data:any, isUrl=false) => {
  return makeRequest("POST", endPoint, { data,isUrl });
};

export const postDataHandlerWithToken = async (endPoint:any, data:any,isUrl=false) => {
  const storedAuth = localStorage.getItem("access_token");
  if(data==null){
    if (!storedAuth) {
    throw new Error('No authentication token found');
  }
  return makeRequest("POST", endPoint, { 
    isUrl,
    ...getAuthHeaders(storedAuth) 
  });
  }
  if (!storedAuth) {
    throw new Error('No authentication token found');
  }
  return makeRequest("POST", endPoint, { 
    data, 
    isUrl,
    ...getAuthHeaders(storedAuth) 
  });
};
export const postDataHandlerWithTokenFormData = async (endPoint:any, data:any,isUrl=false) => {
  const storedAuth = sessionStorage.getItem('auth');
  const initialAuth = storedAuth ? JSON.parse(storedAuth) : null;
  
  if (!initialAuth?.authToken) {
    throw new Error('No authentication token found');
  }
  return makeRequest("POST", endPoint, { 
    data, 
    isUrl,
    ...getAuthHeadersFormData(initialAuth?.authToken) 
  });
};


export const putDataHandler = async (endPoint:any, data:any,isUrl=false) => {
  // console.log(endPoint, data, "5")
  return makeRequest("PUT", endPoint, { data,isUrl });
};

export const putDataHandlerWithToken = async (endPoint:any, data:any, params:any, isUrl=false) => {
  const storedAuth = sessionStorage.getItem('auth');
  const initialAuth = storedAuth ? JSON.parse(storedAuth) : null;
  
  if (!initialAuth?.authToken) {
    throw new Error('No authentication token found');
  }
  return makeRequest("PUT", endPoint, { 
    data, 
    params, 
    isUrl,
    ...getAuthHeaders(initialAuth?.authToken) 
  });
};
export const putDataHandlerWithTokenFormData = async (endPoint:any, data:any, params:any, isUrl=false) => {
  const storedAuth = sessionStorage.getItem('auth');
  const initialAuth = storedAuth ? JSON.parse(storedAuth) : null;
  
  if (!initialAuth?.authToken) {
    throw new Error('No authentication token found');
  }
  return makeRequest("PUT", endPoint, { 
    data, 
    params, 
    isUrl,
    ...getAuthHeadersFormData(initialAuth?.authToken) 
  });
};
export const deleteDataHandler = async (endPoint:any, isUrl=false) => {
  const storedAuth = sessionStorage.getItem('auth');
  const initialAuth = storedAuth ? JSON.parse(storedAuth) : null;
  
  if (!initialAuth?.authToken) {
    throw new Error('No authentication token found');
  }
  return makeRequest("DELETE", endPoint, { 
    isUrl:isUrl, 
    ...getAuthHeaders(initialAuth?.authToken) 
  });
};

export const patchDataHandler = async (endPoint:any, data:any) => {
  return makeRequest("PATCH", endPoint, { data });
};

export const patchTokenDataHandler = async (endPoint:any, data:any ,isUrl=false) => {
  const storedAuth = localStorage.getItem("access_token");
  
  if (!storedAuth) {
    throw new Error('No authentication token found');
  }
  if(data==null){
    return makeRequest("PATCH", endPoint, { 
    isUrl,
    ...getAuthHeaders(storedAuth) 
  });
  }
  return makeRequest("PATCH", endPoint, { 
    data, 
    isUrl,
    ...getAuthHeaders(storedAuth) 
  });
};
export const putTokenDataHandler = async (endPoint:any, data:any) => {
  const storedAuth = sessionStorage.getItem('auth');
  const initialAuth = storedAuth ? JSON.parse(storedAuth) : null;
  
  if (!initialAuth?.authToken) {
    throw new Error('No authentication token found');
  }
  return makeRequest("PUT", endPoint, { 
    data, 
    ...getAuthHeaders(initialAuth?.authToken) 
  });
};

export const patchTokenDataHandlerFormData = async (endPoint:any, data:any) => {
  const storedAuth = sessionStorage.getItem('auth');
  const initialAuth = storedAuth ? JSON.parse(storedAuth) : null;
  
  if (!initialAuth?.authToken) {
    throw new Error('No authentication token found');
  }
  return makeRequest("PATCH", endPoint, { 
    data, 
    ...getAuthHeadersFormData(initialAuth?.authToken) 
  });
};


export const deleteDataHandlerWithoutToken = async (endPoint:any, query:any) => {
  return makeRequest("DELETE", endPoint, { params: query });
};

export const deleteTokenDataHandler = async (endPoint:any, isUrl=false) => {
  const storedAuth = localStorage.getItem("access_token");

  if (!storedAuth) {
    throw new Error('No authentication token found');
  }

  return makeRequest("DELETE", endPoint, {
    isUrl,
    ...getAuthHeaders(storedAuth),
  });
};

export const getDataHandler = async (endPointOrUrl:any, query = {}, data = {}, isUrl = false) => {
  return makeRequest("GET", endPointOrUrl, {
    params: query,
    data,
    isUrl
  });
};

export const getDataHandlerWithToken = async (endPoint:any, query:any, data:any, isUrl = false) => {
  const storedAuth = localStorage.getItem("access_token");
  // console.log(storedAuth,"2")
  if (!storedAuth) {
    throw new Error('No authentication token found');
  }
  return makeRequest("GET", endPoint, { 
    params: query, 
    data, 
    isUrl,
    ...getAuthHeaders(storedAuth) 
  });
};







