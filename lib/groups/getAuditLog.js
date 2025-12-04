// Includes
const http = require('../util/http.js').func

exports.required = ['group']
exports.optional = ['actionType', 'userId', 'sortOrder', 'limit', 'cursor', 'jar']

// Docs
/**
 * 🔐 Get the audit log for the group.
 * @category Group
 * @alias getAuditLog
 * @param {number} group - The id of the group.
 * @param {("DeletePost" | "RemoveMember" | "AcceptJoinRequest" | "DeclineJoinRequest" | "PostStatus" | "ChangeRank" | "BuyAd" | "SendAllyRequest" | "CreateEnemy" | "AcceptAllyRequest" | "DeclineAllyRequest" | "DeleteAlly" | "DeleteEnemy" | "AddGroupPlace" | "RemoveGroupPlace" | "CreateItems" | "ConfigureItems" | "SpendGroupFunds" | "ChangeOwner" | "Delete" | "AdjustCurrencyAmounts" | "Abandon" | "Claim" | "Rename" | "ChangeDescription" | "InviteToClan" | "KickFromClan" | "CancelClanInvite" | "BuyClan" | "CreateGroupAsset" | "UpdateGroupAsset" | "ConfigureGroupAsset" | "RevertGroupAsset" | "CreateGroupDeveloperProduct" | "ConfigureGroupGame" | "Lock" | "Unlock" | "CreateGamePass" | "CreateBadge" | "ConfigureBadge" | "SavePlace" | "PublishPlace" | "joinGroup" | "leaveGroup")=} actionType - The action type to filter for.
 * @param {number=} userId - The user's id to filter for.
 * @param {SortOrder=} sortOrder - The order to sort the logs by.
 * @param {Limit=} limit - The maximum logs per a page.
 * @param {string=} cursor - The cursor for the page.
 * @returns {Promise<AuditPage>}
 * @example const noblox = require("noblox.js")
 * // Login using your cookie
 * const rankLogs = await noblox.getAuditLog(1, "ChangeRank", 2, "Asc")
**/

async function getAuditLog(group, actionType, userId, sortOrder, limit, cursor, jar) {
  try {
  const fetchLogs = async (type) => {
    const httpOpt = {
      url: `https://groups.roblox.com/v1/groups/${group}/audit-log?actionType=${type}&cursor=${cursor}&limit=${limit}&sortOrder=${sortOrder}&userId=${userId}`,
      options: {
        method: 'GET',
        resolveWithFullResponse: true,
        jar
      }
    };

    const res = await http(httpOpt);
    const json = JSON.parse(res.body);

    if (res.statusCode !== 200) {
      throw new Error(json.errors?.map(e => e.message).join("\n") || "Unknown error.");
    }

    json.data = json.data.map(entry => {
      entry.created = new Date(entry.created);
      entry.created.setMilliseconds(0);
      return entry;
    });

    return json;
  };

  if (actionType && actionType !== "all") {
    return await fetchLogs(actionType);
  }

  const allLogs = await fetchLogs("");
  const [joinLogs, leaveLogs] = await Promise.all([
    fetchLogs("joinGroup"),
    fetchLogs("leaveGroup")
  ]);

  allLogs.data = [
    ...allLogs.data,
    ...joinLogs.data,
    ...leaveLogs.data
  ].sort((a, b) => new Date(b.created) - new Date(a.created));

  return allLogs;
    } catch (err) {
      reject(err);
    }
}

// Define
exports.func = function (args) {
  const jar = args.jar
  const actionType = args.actionType || ''
  const userId = args.userId || ''
  const sortOrder = args.sortOrder || 'Asc'
  const limit = args.limit || (100).toString()
  const cursor = args.cursor || ''
  return getAuditLog(args.group, actionType, userId, sortOrder, limit, cursor, jar)
}
