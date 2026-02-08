const { normalizeUseCase } = require("./useCases");

function computeOutcome(permission, companyDeclaredUseCases) {
  const allowedUseCases = Array.isArray(permission.allowedUseCases)
    ? permission.allowedUseCases.map(normalizeUseCase).filter(Boolean)
    : [];

  const declaredUseCases = Array.isArray(companyDeclaredUseCases)
    ? companyDeclaredUseCases.map(normalizeUseCase).filter(Boolean)
    : [];

  if (permission.aiTrainingAllowed === "no") {
    return {
      outcome: "restricted",
      reason: "Artist permission disallows AI training."
    };
  }

  const hasDeclaredUseCaseMatch =
    allowedUseCases.length === 0 || declaredUseCases.some((useCase) => allowedUseCases.includes(useCase));

  if (!hasDeclaredUseCaseMatch) {
    return {
      outcome: "restricted",
      reason: "Company declared use cases are outside artist allowed use cases."
    };
  }

  if (permission.aiTrainingAllowed === "conditional") {
    return {
      outcome: "conditional",
      reason: "Artist permission requires a conditional agreement."
    };
  }

  return {
    outcome: "allowed",
    reason: "Declared use cases are permitted by the artist permission."
  };
}

module.exports = {
  computeOutcome
};
