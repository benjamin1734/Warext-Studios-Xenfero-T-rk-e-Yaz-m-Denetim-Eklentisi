<?php

namespace Warext\TurkishSpellCheck;

use XF\AddOn\AbstractSetup;
use XF\AddOn\StepRunnerInstallTrait;
use XF\AddOn\StepRunnerUninstallTrait;
use XF\AddOn\StepRunnerUpgradeTrait;
use XF\Db\Schema\Create;

class Setup extends AbstractSetup
{
    use StepRunnerInstallTrait;
    use StepRunnerUpgradeTrait;
    use StepRunnerUninstallTrait;

    public function installStep1(): void
    {
        $this->schemaManager()->createTable('xf_warext_spell_cache', function (Create $table)
        {
            $table->addColumn('word_hash', 'varbinary', 32)->primaryKey();
            $table->addColumn('word', 'varchar', 96);
            $table->addColumn('is_correct', 'tinyint')->setDefault(0);
            $table->addColumn('suggestions', 'mediumblob')->nullable();
            $table->addColumn('provider', 'varchar', 32)->setDefault('');
            $table->addColumn('expires_date', 'int')->setDefault(0);
            $table->addKey('expires_date');
        });
    }

    public function installStep2(): void
    {
        $this->createFeedbackTable();
    }

    protected function createFeedbackTable(): void
    {
        $this->schemaManager()->createTable('xf_warext_spell_feedback', function (Create $table)
        {
            $table->addColumn('feedback_id', 'int')->unsigned()->autoIncrement();
            $table->addColumn('user_id', 'int')->unsigned()->setDefault(0);
            $table->addColumn('feedback_type', 'varchar', 32)->setDefault('');
            $table->addColumn('rule_key', 'varchar', 96)->setDefault('');
            $table->addColumn('word', 'varchar', 96)->setDefault('');
            $table->addColumn('target', 'varchar', 128)->setDefault('');
            $table->addColumn('source_text', 'varchar', 320)->setDefault('');
            $table->addColumn('confidence', 'smallint')->unsigned()->setDefault(0);
            $table->addColumn('report_date', 'int')->unsigned()->setDefault(0);
            $table->addKey(['user_id', 'report_date'], 'user_date');
            $table->addKey(['feedback_type', 'report_date'], 'type_date');
            $table->addKey(['rule_key', 'report_date'], 'rule_date');
            $table->addKey(['word', 'report_date'], 'word_date');
        });
    }

    public function upgrade5000070Step1(): void
    {
        try
        {
            $this->query('TRUNCATE TABLE xf_warext_spell_cache');
        }
        catch (\Throwable $e)
        {
        }

        try
        {
            $this->createFeedbackTable();
        }
        catch (\Throwable $e)
        {
        }

        try
        {
            $root = \XF::getRootDirectory();
            $directory = $root . '/js/warext/turkish-spellcheck';
            $keep = [
                'bootstrap-v110.js',
                'text-core-v110.js',
                'dictionary-v110.js',
                'lexicon-v200.js',
                'corrections-v110.js',
                'language-v110.js',
                'semantic-v110.js',
                'semantic-deep-v110.js',
                'semantic-context-v110.js',
                'entities-v200.js',
                'idioms-v200.js',
                'lm-v200.js',
                'micro-model-v200.js',
                'knowledge-v200.js',
                'micro-integration-v200.js',
                'learning-v200.js',
                'semantic-ui-v110.js',
                'editor-v110.js',
                'longtext-v110.js'
            ];
            $allowed = array_fill_keys($keep, true);
            foreach (glob($directory . '/*.js') ?: [] as $file)
            {
                if (!isset($allowed[basename($file)]) && is_file($file))
                {
                    @unlink($file);
                }
            }
        }
        catch (\Throwable $e)
        {
        }
    }

    public function uninstallStep1(): void
    {
        $this->schemaManager()->dropTable('xf_warext_spell_feedback');
        $this->schemaManager()->dropTable('xf_warext_spell_cache');
    }
}
