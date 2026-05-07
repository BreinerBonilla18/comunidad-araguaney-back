import jwt from "jsonwebtoken";

export const globalAuth = (req, res, next) => {
  const publicRoutes = [
    { path: "/register-user", method: "POST" },
    { path: "/login-user", method: "POST" },
  ];

  const isPublic = publicRoutes.some(
    (route) => req.path === route.path && req.method === route.method,
  );

  if (isPublic) return next();

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No se ha recibido un token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Token invalido" });
  }
};
