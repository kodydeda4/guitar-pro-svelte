//#region node_modules/layerchart/dist/utils/math.js
/**
* Convert degrees to radians
*/
function degreesToRadians(degrees) {
	return degrees * Math.PI / 180;
}
/**
* Convert radians to degrees
*/
function radiansToDegrees(radians) {
	return radians * (180 / Math.PI);
}
/**
* Convert cartesian to polar coordinate system.  Angle in radians with 0 at the 12 o'clock position
*/
function cartesianToPolar(x, y) {
	let radians = Math.atan2(y, x);
	radians += Math.PI / 2;
	if (radians < 0) radians += 2 * Math.PI;
	return {
		radius: Math.sqrt(x ** 2 + y ** 2),
		radians
	};
}
/**
* Calculate the angle and length between two points
* @param point1 - First point
* @param point2 - Second point
* @returns Angle in degrees and length
*/
function pointsToAngleAndLength(point1, point2) {
	const dx = point2.x - point1.x;
	const dy = point2.y - point1.y;
	const radians = Math.atan2(dy, dx);
	const length = Math.sqrt(dx * dx + dy * dy);
	return {
		radians,
		angle: radiansToDegrees(radians),
		length
	};
}
/** Parse percent string (`50%`) to decimal (`0.5`) */
function parsePercent(percent) {
	if (typeof percent === "number") return percent;
	else return Number(percent.replace("%", "")) / 100;
}
//#endregion
export { radiansToDegrees as a, pointsToAngleAndLength as i, degreesToRadians as n, parsePercent as r, cartesianToPolar as t };

//# sourceMappingURL=math.js.map