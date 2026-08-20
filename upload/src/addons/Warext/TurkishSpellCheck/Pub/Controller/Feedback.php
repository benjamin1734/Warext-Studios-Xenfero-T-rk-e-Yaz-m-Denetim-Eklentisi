<?php

namespace Warext\TurkishSpellCheck\Pub\Controller;

use XF\Pub\Controller\AbstractController;

class Feedback extends AbstractController
{
    public function actionIndex()
    {
        $this->assertPostOnly();

        $visitor = \XF::visitor();
        if (!$visitor->user_id || !\XF::options()->warextSpellFeedback)
        {
            return $this->noPermission();
        }

        $raw = $this->filter('payload', 'str');
        $payload = json_decode($raw, true);
        if (!is_array($payload))
        {
            return $this->error('Geçersiz geri bildirim.');
        }

        $type = substr((string)($payload['type'] ?? ''), 0, 32);
        if (!in_array($type, ['false_positive', 'accepted'], true))
        {
            return $this->error('Geçersiz geri bildirim türü.');
        }

        $rule = substr((string)($payload['rule'] ?? ''), 0, 96);
        $word = substr((string)($payload['word'] ?? $payload['from'] ?? ''), 0, 96);
        $target = substr((string)($payload['to'] ?? ''), 0, 128);
        $text = substr((string)($payload['text'] ?? ''), 0, 320);
        $confidence = max(0, min(1000, (int)round(((float)($payload['confidence'] ?? 0)) * 1000)));
        $now = \XF::$time;

        $last = (int)\XF::db()->fetchOne(
            'SELECT MAX(report_date) FROM xf_warext_spell_feedback WHERE user_id = ?',
            $visitor->user_id
        );
        if ($last && $last > $now - 2)
        {
            return $this->message('OK');
        }

        \XF::db()->insert('xf_warext_spell_feedback', [
            'user_id' => $visitor->user_id,
            'feedback_type' => $type,
            'rule_key' => $rule,
            'word' => $word,
            'target' => $target,
            'source_text' => $text,
            'confidence' => $confidence,
            'report_date' => $now
        ]);

        return $this->message('OK');
    }
}
