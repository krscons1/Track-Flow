var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var path = require("path");
var getDatabase = require(path.join(__dirname, "../lib/server-only/mongodb")).getDatabase;
var ObjectId = require("mongodb").ObjectId;
function recalculatePomodoroSessions() {
    return __awaiter(this, void 0, void 0, function () {
        var db, users, _i, users_1, user, userId, sessions, sessionsByDay, _a, sessions_1, session, day, _b, _c, _d, day, logs, focusSessions, inFocus, _e, logs_1, log, dateStart, dateEnd, result;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, getDatabase()];
                case 1:
                    db = _f.sent();
                    return [4 /*yield*/, db.collection("users").find({}).toArray()];
                case 2:
                    users = _f.sent();
                    console.log("Found ".concat(users.length, " users."));
                    _i = 0, users_1 = users;
                    _f.label = 3;
                case 3:
                    if (!(_i < users_1.length)) return [3 /*break*/, 9];
                    user = users_1[_i];
                    userId = user._id;
                    return [4 /*yield*/, db.collection("pomodoroSessions").find({ userId: new ObjectId(userId) }).sort({ startTime: 1 }).toArray()];
                case 4:
                    sessions = _f.sent();
                    if (sessions.length === 0)
                        return [3 /*break*/, 8];
                    sessionsByDay = {};
                    for (_a = 0, sessions_1 = sessions; _a < sessions_1.length; _a++) {
                        session = sessions_1[_a];
                        day = new Date(session.startTime).toISOString().slice(0, 10);
                        // @ts-ignore
                        (sessionsByDay[day] = sessionsByDay[day] || []).push(session);
                    }
                    _b = 0, _c = Object.entries(sessionsByDay);
                    _f.label = 5;
                case 5:
                    if (!(_b < _c.length)) return [3 /*break*/, 8];
                    _d = _c[_b], day = _d[0], logs = _d[1];
                    focusSessions = 0;
                    inFocus = false;
                    // @ts-ignore
                    for (_e = 0, logs_1 = logs; _e < logs_1.length; _e++) {
                        log = logs_1[_e];
                        if (log.type === "focus") {
                            if (!inFocus) {
                                focusSessions += 1;
                                inFocus = true;
                            }
                        }
                        if (log.type === "break" && log.status === "completed") {
                            inFocus = false;
                        }
                        // If break is skipped, inFocus remains true
                    }
                    dateStart = new Date(day + "T00:00:00.000Z");
                    dateEnd = new Date(day + "T23:59:59.999Z");
                    return [4 /*yield*/, db.collection("timelogs").updateMany({
                            userId: new ObjectId(userId),
                            date: { $gte: dateStart, $lte: dateEnd },
                        }, { $set: { pomodoroSessions: focusSessions } })];
                case 6:
                    result = _f.sent();
                    console.log("User ".concat(userId, " | ").concat(day, ": Set pomodoroSessions = ").concat(focusSessions, " (updated ").concat(result.modifiedCount, " timelogs)"));
                    _f.label = 7;
                case 7:
                    _b++;
                    return [3 /*break*/, 5];
                case 8:
                    _i++;
                    return [3 /*break*/, 3];
                case 9:
                    console.log("Recalculation complete.");
                    return [2 /*return*/];
            }
        });
    });
}
recalculatePomodoroSessions().catch(function (err) {
    console.error("Error during recalculation:", err);
    process.exit(1);
});
