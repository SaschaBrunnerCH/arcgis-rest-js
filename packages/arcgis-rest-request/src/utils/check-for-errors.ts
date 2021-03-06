import { ArcGISRequestError } from "./ArcGISRequestError";
import { ArcGISAuthError } from "./ArcGISAuthError";
import { IRequestOptions } from "./IRequestOptions";
import { IParams } from "./IParams";

/**
 * Checks for errors in a JSON response from the ArcGIS REST API. If there are no errors, it will return the `data` passed in. If there is an error, it will throw an `ArcGISRequestError` or `ArcGISAuthError`.
 *
 * @param data The response JSON to check for errors.
 * @param url The url of the original request
 * @param params The parameters of the original request
 * @param options The options of the original request
 * @returns The data that was passed in the `data` parameter
 */
export function checkForErrors(
  response: any,
  url?: string,
  params?: IParams,
  options?: IRequestOptions,
  originalAuthError?: ArcGISAuthError
): any {
  // this is an error message from billing.arcgis.com backend
  if (response.code >= 400) {
    const { message, code } = response;
    throw new ArcGISRequestError(message, code, response, url, options);
  }

  // error from ArcGIS Online or an ArcGIS Portal or server instance.
  if (response.error) {
    const { message, code, messageCode } = response.error;
    const errorCode = messageCode || code || "UNKNOWN_ERROR_CODE";

    if (
      code === 498 ||
      code === 499 ||
      messageCode === "GWM_0003" ||
      (code === 400 && message === "Unable to generate token.")
    ) {
      if (originalAuthError) {
        throw originalAuthError;
      } else {
        throw new ArcGISAuthError(message, errorCode, response, url, options);
      }
    }

    throw new ArcGISRequestError(message, errorCode, response, url, options);
  }

  // error from a status check
  if (response.status === "failed" || response.status === "failure") {
    let message: string;
    let code: string = "UNKNOWN_ERROR_CODE";

    try {
      message = JSON.parse(response.statusMessage).message;
      code = JSON.parse(response.statusMessage).code;
    } catch (e) {
      message = response.statusMessage || response.message;
    }

    throw new ArcGISRequestError(message, code, response, url, options);
  }

  return response;
}
