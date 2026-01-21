// src/lib/utils/statsUtils.js

export const safeDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
};

export const getLocalDateStr = (dateObj) => {
    if (!dateObj) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

export const getSmoothPath = (points, key, scaleMax, graphHeight = 60, padding = 5) => {
    if (points.length === 0) return "";
    const safeMax = scaleMax || 1;
    const coords = points.map((p, i) => {
        const x = (i / (points.length - 1)) * 300;
        const normalized = p[key] / safeMax;
        const y = (graphHeight + padding) - (normalized * graphHeight); 
        return [x, y];
    });
    
    let d = `M ${coords[0][0]} ${coords[0][1]}`;
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i === 0 ? 0 : i - 1];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[i + 2] || p2;
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
    }
    return d;
};

export const getTrendY = (val, max, height = 60, padding = 5) => {
    const normalized = val / (max || 1);
    return (height + padding) - (normalized * height);
};