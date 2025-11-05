import { validate } from "uuid";

import { nanoidId } from "../schema/index.js";

export function validateId(id: string, type: "nanoid" | "uuid") {
  if (!id) {
    return {
      isValidId: false,
      error: "ID is required",
      message: "ID is required",
      statusCode: 400,
    };
  }

  if (!type) {
    return {
      isValidId: false,
      error: "Type is required",
      message: "Type is required",
      statusCode: 400,
    };
  }

  if (type === "nanoid") {
    const isNanoid = nanoidId.safeParse(id);

    if (isNanoid.error) {
      return {
        isValidId: false,
        error: "Invalid nanoid format",
        message: "The provided ID does not match the expected nanoid format",
        statusCode: 400,
      };
    }

    return {
      isValidId: true,
      error: null,
      message: "Valid nanoid ID",
      statusCode: 200,
    };
  }

  if (type === "uuid") {
    const isNanoid = validate(id);

    if (!isNanoid) {
      return {
        isValidId: false,
        error: "Invalid uuid format",
        message: "The provided ID does not match the expected uuid format",
        statusCode: 400,
      };
    }

    return {
      isValidId: true,
      error: null,
      message: "Valid uuid ID",
      statusCode: 200,
    };
  }
  return {
    isValidId: false,
    error: "Invalid ID type",
    message:
      "The provided ID type is not supported. Expected 'nanoid' or 'uuid'",
    statusCode: 400,
  };
}
