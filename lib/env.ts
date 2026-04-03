/** ייצור ב-Vercel או בניית production מקומית */
export function isProductionDeploy(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}
