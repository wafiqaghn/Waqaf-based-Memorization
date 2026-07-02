/* eslint-disable import/prefer-default-export */
/**
 * User input error for the widget endpoint.
 * Use this to return a specific status code with a user-friendly message.
 */
export class WidgetInputError extends Error {
  status: number;

  /**
   * @param {number} status - HTTP status code.
   * @param {string} message - Error message.
   */
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
