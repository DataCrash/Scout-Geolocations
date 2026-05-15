using MediatR;

namespace Scout.Challenge.Api.Domain.Events;

/// <summary>Publicado quando um desafio é validado com sucesso.</summary>
public record ChallengeValidated(
    Guid AttemptId,
    Guid ChallengeId,
    Guid PatrulhaId,
    Guid UserId,
    int PointsAwarded,
    DateTime ValidatedAt) : INotification;

/// <summary>Publicado quando uma tentativa de desafio falha na validação.</summary>
public record ChallengeFailed(
    Guid AttemptId,
    Guid ChallengeId,
    Guid PatrulhaId,
    Guid UserId,
    string FailReason,
    DateTime AttemptedAt) : INotification;

/// <summary>Publicado quando todos os desafios de um evento foram concluídos por uma patrulha.</summary>
public record ChallengeCompleted(
    Guid PatrulhaId,
    Guid EventId,
    int TotalPoints,
    DateTime CompletedAt) : INotification;
