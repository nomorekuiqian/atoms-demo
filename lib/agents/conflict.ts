/** InsForge RPC may wrap SQLSTATE; match only our fixed server messages. */
export function isRunConflict(error: {code?:string;message:string}) {
  return error.code === "40001" || error.code === "22023" || /(?:project changed|request is still running|request identifier already used|expired request)/i.test(error.message);
}
